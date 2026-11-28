import React, { useEffect, useMemo, useState } from 'react';
import capsService from '../../../services/capsService';

import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

type Donation = {
  id: number | string;
  data: string;
  quantidadeKg: number;
  tipo: 'MANUAL' | 'BALANCA';
  responsavel: string;
};

type CampoProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
};

const COR_PRINCIPAL = '#8754bf';

const converterUnidades = (kg: number) => Math.round(kg * 500);

const formatarData = (data: string) => {
  const [ano, mes, dia] = data.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

function Campo({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: CampoProps) {
  return (
    <View className="flex-1 gap-2">
      <Text className="text-sm font-semibold text-slate-600">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor="#94A3B8"
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800"
      />
    </View>
  );
}

export default function DashRegistration() {
  const hoje = new Date();
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
  const anoAtual = String(hoje.getFullYear());

  const [doacoes, setDoacoes] = useState<Donation[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  // CADASTRO MANUAL
  const [data, setData] = useState(
    `${anoAtual}-${mesAtual}-${String(hoje.getDate()).padStart(2, '0')}`
  );
  const [peso, setPeso] = useState('');

  // EDIÇÃO
  const [editandoId, setEditandoId] = useState<number | string | null>(null);
  const [dataEdicao, setDataEdicao] = useState('');
  const [pesoEdicao, setPesoEdicao] = useState('');

  // FILTROS DO RESUMO
  const [filtroResumoDia, setFiltroResumoDia] = useState('');
  const [filtroResumoMes, setFiltroResumoMes] = useState(mesAtual);
  const [filtroResumoAno, setFiltroResumoAno] = useState(anoAtual);

  // FILTROS DO HISTÓRICO
  const [filtroDia, setFiltroDia] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroAno, setFiltroAno] = useState('');
  const [filtroResponsavel, setFiltroResponsavel] = useState('TODOS');

  useEffect(() => {
    carregarRegistros();
  }, []);

  const carregarRegistros = async () => {
    try {
      setCarregando(true);
      setErro('');

      const registros = await capsService.listarRegistros();

      const registrosFormatados: Donation[] = registros.map((item) => ({
        id: item.id,
        data: item.data.slice(0, 10),
        quantidadeKg: Number(item.quantidade_kg),
        tipo: item.origem,
        responsavel: item.responsavel,
      }));

      setDoacoes(registrosFormatados);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os registros.'
      );
    } finally {
      setCarregando(false);
    }
  };

  // REGISTROS DO RESUMO
  const doacoesResumo = useMemo(() => {
    return doacoes.filter((item) => {
      const [ano, mes, dia] = item.data.split('-');

      return (
        (!filtroResumoDia || dia === filtroResumoDia.padStart(2, '0')) &&
        (!filtroResumoMes || mes === filtroResumoMes.padStart(2, '0')) &&
        (!filtroResumoAno || ano === filtroResumoAno)
      );
    });
  }, [doacoes, filtroResumoDia, filtroResumoMes, filtroResumoAno]);

  // REGISTROS DO HISTÓRICO
  const doacoesFiltradas = useMemo(() => {
    return doacoes
      .filter((item) => {
        const [ano, mes, dia] = item.data.split('-');

        const correspondeDia =
          !filtroDia || dia === filtroDia.padStart(2, '0');

        const correspondeMes =
          !filtroMes || mes === filtroMes.padStart(2, '0');

        const correspondeAno =
          !filtroAno || ano === filtroAno;

        const correspondeResponsavel =
          filtroResponsavel === 'TODOS' ||
          item.tipo === filtroResponsavel;

        return (
          correspondeDia &&
          correspondeMes &&
          correspondeAno &&
          correspondeResponsavel
        );
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [doacoes, filtroDia, filtroMes, filtroAno, filtroResponsavel]);

  // TOTAIS DO RESUMO
  const totalKg = doacoesResumo.reduce(
    (total, item) => total + item.quantidadeKg,
    0
  );

  const totalDoacoes = doacoesResumo.length;

  const limparFiltros = () => {
    setFiltroDia('');
    setFiltroMes('');
    setFiltroAno('');
    setFiltroResponsavel('TODOS');
  };

  // CADASTRAR NOVA DOAÇÃO
  const salvarDoacao = async () => {
    const pesoNumerico = Number(peso.replace(',', '.'));

    if (!data || !peso || !Number.isFinite(pesoNumerico) || pesoNumerico <= 0) {
      Alert.alert('Atenção', 'Informe uma data e um peso válido.');
      return;
    }

    try {
      setSalvando(true);

      await capsService.cadastrarRegistro(data, pesoNumerico);

      Alert.alert('Sucesso', 'Doação cadastrada com sucesso!');

      setPeso('');
      await carregarRegistros();
    } catch (error) {
      console.error('Erro ao cadastrar registro:', error);

      Alert.alert(
        'Erro',
        error instanceof Error
          ? error.message
          : 'Não foi possível cadastrar a doação.'
      );
    } finally {
      setSalvando(false);
    }
  };

  // INICIAR EDIÇÃO NO CARD
  const editarDoacao = (item: Donation) => {
    if (item.tipo !== 'MANUAL') return;

    setEditandoId(item.id);
    setDataEdicao(item.data);
    setPesoEdicao(String(item.quantidadeKg).replace('.', ','));
  };

  // SALVAR ALTERAÇÕES DO CARD
  const salvarEdicao = async () => {
    const pesoNumerico = Number(pesoEdicao.replace(',', '.'));

    if (
      !dataEdicao ||
      !pesoEdicao ||
      !Number.isFinite(pesoNumerico) ||
      pesoNumerico <= 0
    ) {
      Alert.alert('Atenção', 'Informe uma data e um peso válido.');
      return;
    }

    try {
      setSalvando(true);

      await capsService.editarRegistro(
        editandoId!,
        dataEdicao,
        pesoNumerico
      );

      setEditandoId(null);
      setDataEdicao('');
      setPesoEdicao('');

      await carregarRegistros();

      Alert.alert('Sucesso', 'Registro atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao editar registro:', error);

      Alert.alert(
        'Erro',
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o registro.'
      );
    } finally {
      setSalvando(false);
    }
  };

  // CANCELAR EDIÇÃO
  const cancelarEdicao = () => {
    setEditandoId(null);
    setDataEdicao('');
    setPesoEdicao('');
  };

  const excluirDoacao = (item: Donation) => {
    Alert.alert(
      'Excluir doação',
      'Deseja realmente excluir este registro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await capsService.excluirRegistro(
                item.id,
                item.tipo
              );

              if (editandoId === item.id && item.tipo === 'MANUAL') {
                cancelarEdicao();
              }

              await carregarRegistros();

              Alert.alert(
                'Sucesso',
                'Registro excluído com sucesso!'
              );

            } catch (error) {
              console.error('Erro ao excluir registro:', error);

              Alert.alert(
                'Erro',
                error instanceof Error
                  ? error.message
                  : 'Não foi possível excluir o registro.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1 bg-slate-100"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-6">

          {/* CABEÇALHO */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-slate-800">
              Registros
            </Text>

            <Text className="text-base text-slate-500">
              Acompanhamento das doações de tampinhas
            </Text>
          </View>

          {/* FILTRO DO RESUMO */}
          <View className="rounded-2xl bg-white p-5 shadow-sm">
            <Text className="text-lg font-bold text-slate-800">
              Filtro do resumo das arrecadações
            </Text>

            <Text className="mb-5 mt-1 text-sm text-slate-500">
              Consulte as arrecadações de um período específico.
            </Text>

            <View className="flex-row gap-3">
              <Campo
                label="Dia"
                value={filtroResumoDia}
                onChangeText={setFiltroResumoDia}
                placeholder="DD"
                keyboardType="numeric"
              />

              <Campo
                label="Mês"
                value={filtroResumoMes}
                onChangeText={setFiltroResumoMes}
                placeholder="MM"
                keyboardType="numeric"
              />

              <Campo
                label="Ano"
                value={filtroResumoAno}
                onChangeText={setFiltroResumoAno}
                placeholder="AAAA"
                keyboardType="numeric"
              />
            </View>

            <Pressable
              onPress={() => {
                setFiltroResumoDia('');
                setFiltroResumoMes(mesAtual);
                setFiltroResumoAno(anoAtual);
              }}
              className="mt-4 self-start"
            >
              <Text className="font-semibold" style={{ color: COR_PRINCIPAL }}>
                Restaurar período atual
              </Text>
            </Pressable>
          </View>

          {/* RESUMO DAS ARRECADAÇÕES */}
          <View className="rounded-2xl bg-white p-5 shadow-sm">
            <Text className="mb-4 text-lg font-bold text-slate-800">
              Resumo das arrecadações
            </Text>

            <View className="flex-row gap-3">
              <View className="flex-1 rounded-xl bg-purple-50 p-4">
                <Text className="text-sm font-medium text-slate-600">
                  Total arrecadado
                </Text>

                <Text
                  className="mt-2 text-2xl font-bold"
                  style={{ color: COR_PRINCIPAL }}
                >
                  {totalKg.toFixed(2).replace('.', ',')} kg
                </Text>

                <Text className="mt-1 text-xs text-slate-500">
                  Em tampinhas
                </Text>
              </View>

              <View className="flex-1 rounded-xl bg-slate-100 p-4">
                <Text className="text-sm font-medium text-slate-600">
                  Doações
                </Text>

                <Text className="mt-2 text-2xl font-bold text-slate-800">
                  {totalDoacoes}
                </Text>

                <Text className="mt-1 text-xs text-slate-500">
                  Registros encontrados
                </Text>
              </View>
            </View>

            <Text className="mt-4 text-xs text-slate-400">
              Os valores são atualizados conforme o filtro do resumo.
            </Text>
          </View>
          {/* CADASTRO MANUAL */}
          <View className="rounded-2xl bg-white p-5 shadow-sm">
            <Text className="text-lg font-bold text-slate-800">
              Cadastro manual
            </Text>

            <Text className="mb-5 mt-1 text-sm text-slate-500">
              Registro realizado pela administradora.
            </Text>

            <View className="gap-4">
              <Campo
                label="Data da doação"
                value={data}
                onChangeText={setData}
                placeholder="AAAA-MM-DD"
              />

              <Campo
                label="Quantidade em kg"
                value={peso}
                onChangeText={setPeso}
                placeholder="Ex.: 5,5"
                keyboardType="decimal-pad"
              />

              <View className="rounded-xl bg-purple-50 p-4">
                <Text className="text-sm font-medium text-slate-600">
                  Unidades estimadas
                </Text>

                <Text
                  className="mt-1 text-xl font-bold"
                  style={{ color: COR_PRINCIPAL }}
                >
                  {peso && Number.isFinite(Number(peso.replace(',', '.')))
                    ? converterUnidades(Number(peso.replace(',', '.'))).toLocaleString('pt-BR')
                    : '0'}
                </Text>

                <Text className="mt-1 text-xs text-slate-500">
                  Estimativa de 500 tampinhas por kg.
                </Text>
              </View>

              <Pressable
                onPress={salvarDoacao}
                disabled={salvando}
                className={`items-center rounded-xl py-4 ${salvando ? 'bg-purple-300' : 'bg-purple-600 active:bg-purple-700'
                  }`}
                style={!salvando ? { backgroundColor: COR_PRINCIPAL } : undefined}
              >
                <Text className="font-bold text-white">
                  {salvando ? 'Salvando...' : 'Cadastrar doação'}
                </Text>
              </Pressable>
            </View>
          </View>
          {/* FILTROS DO HISTÓRICO */}
          <View className="rounded-2xl bg-white p-5 shadow-sm">
            <Text className="text-lg font-bold text-slate-800">
              Filtros do histórico
            </Text>

            <Text className="mb-5 mt-1 text-sm text-slate-500">
              Filtre as doações exibidas no histórico.
            </Text>

            <View className="flex-row gap-3">
              <Campo
                label="Dia"
                value={filtroDia}
                onChangeText={setFiltroDia}
                placeholder="DD"
                keyboardType="numeric"
              />

              <Campo
                label="Mês"
                value={filtroMes}
                onChangeText={setFiltroMes}
                placeholder="MM"
                keyboardType="numeric"
              />

              <Campo
                label="Ano"
                value={filtroAno}
                onChangeText={setFiltroAno}
                placeholder="AAAA"
                keyboardType="numeric"
              />
            </View>

            <Text className="mb-3 mt-5 text-sm font-semibold text-slate-600">
              Responsável
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {[
                { label: 'Todos', value: 'TODOS' },
                { label: 'Administradora', value: 'MANUAL' },
                { label: 'Pontos de coleta', value: 'BALANCA' },
              ].map((opcao) => {
                const selecionado = filtroResponsavel === opcao.value;

                return (
                  <Pressable
                    key={opcao.value}
                    onPress={() => setFiltroResponsavel(opcao.value)}
                    className={`rounded-full px-4 py-2 ${selecionado ? 'bg-purple-100' : 'bg-slate-100'
                      }`}
                    style={
                      selecionado
                        ? { borderWidth: 1, borderColor: COR_PRINCIPAL }
                        : undefined
                    }
                  >
                    <Text
                      className={`text-xs font-semibold ${selecionado ? 'text-purple-800' : 'text-slate-600'
                        }`}
                    >
                      {opcao.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={limparFiltros}
              className="mt-5 self-start"
            >
              <Text
                className="font-semibold"
                style={{ color: COR_PRINCIPAL }}
              >
                Limpar filtros
              </Text>
            </Pressable>
          </View>

          {/* HISTÓRICO */}
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-slate-800">
                Histórico de doações
              </Text>

              <Text className="text-sm text-slate-500">
                {doacoesFiltradas.length} registros
              </Text>
            </View>

            {/* LEGENDA */}
            <View className="flex-row flex-wrap gap-4">
              <View className="flex-row items-center gap-2">
                <View
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COR_PRINCIPAL }}
                />
                <Text className="text-xs text-slate-600">
                  Registro manual
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <View className="h-3 w-3 rounded-full bg-slate-400" />
                <Text className="text-xs text-slate-600">
                  Balança IoT
                </Text>
              </View>
            </View>

            {/* CARREGAMENTO, ERRO OU HISTÓRICO */}
            {carregando ? (
              <View className="rounded-2xl bg-white p-8">
                <Text className="text-center text-slate-500">
                  Carregando registros...
                </Text>
              </View>
            ) : erro ? (
              <View className="rounded-2xl bg-white p-8">
                <Text className="text-center text-red-600">
                  {erro}
                </Text>

                <Pressable
                  onPress={carregarRegistros}
                  className="mt-4 items-center rounded-xl bg-slate-100 py-3"
                >
                  <Text className="font-bold text-slate-700">
                    Tentar novamente
                  </Text>
                </Pressable>
              </View>
            ) : doacoesFiltradas.length === 0 ? (
              <View className="rounded-2xl bg-white p-8">
                <Text className="text-center text-slate-500">
                  Nenhuma doação encontrada.
                </Text>
              </View>
            ) : (
              doacoesFiltradas.map((item) => {
                const manual = item.tipo === 'MANUAL';
                const emEdicao = editandoId === item.id && manual;

                return (
                  <View
                    key={`${item.tipo}-${item.id}`}
                    className="rounded-2xl border-l-4 bg-white p-5 shadow-sm"
                    style={{
                      borderLeftColor: manual ? COR_PRINCIPAL : '#94A3B8',
                    }}
                  >
                    {/* CABEÇALHO DO CARD */}
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-bold text-slate-800">
                        Doação #{item.id}
                      </Text>

                      <View
                        className={`rounded-full px-3 py-1 ${manual ? 'bg-purple-50' : 'bg-slate-100'
                          }`}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{
                            color: manual ? COR_PRINCIPAL : '#64748B',
                          }}
                        >
                          {manual ? 'MANUAL' : 'BALANÇA IoT'}
                        </Text>
                      </View>
                    </View>

                    {/* INFORMAÇÕES DO CARD */}
                    <View className="mt-4 gap-4">

                      {/* DATA */}
                      <View className="gap-2">
                        <Text className="text-sm text-slate-500">
                          Data da doação
                        </Text>

                        {emEdicao ? (
                          <TextInput
                            value={dataEdicao}
                            onChangeText={setDataEdicao}
                            placeholder="AAAA-MM-DD"
                            autoFocus
                            placeholderTextColor="#94A3B8"
                            className="rounded-xl border bg-purple-50 px-4 py-3 text-base text-slate-800"
                            style={{ borderColor: COR_PRINCIPAL }}
                          />
                        ) : (
                          <Text className="font-semibold text-slate-700">
                            {formatarData(item.data)}
                          </Text>
                        )}
                      </View>

                      {/* QUANTIDADE */}
                      <View className="gap-2">
                        <Text className="text-sm text-slate-500">
                          Quantidade em kg
                        </Text>

                        {emEdicao ? (
                          <TextInput
                            value={pesoEdicao}
                            onChangeText={setPesoEdicao}
                            placeholder="Ex.: 5,5"
                            keyboardType="decimal-pad"
                            placeholderTextColor="#94A3B8"
                            className="rounded-xl border bg-purple-50 px-4 py-3 text-base text-slate-800"
                            style={{ borderColor: COR_PRINCIPAL }}
                          />
                        ) : (
                          <Text className="font-semibold text-slate-700">
                            {item.quantidadeKg.toFixed(2).replace('.', ',')} kg
                          </Text>
                        )}
                      </View>

                      {/* UNIDADES ESTIMADAS */}
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-slate-500">
                          Unidades estimadas
                        </Text>

                        <Text className="font-semibold text-slate-700">
                          {converterUnidades(
                            emEdicao
                              ? Number(pesoEdicao.replace(',', '.')) || 0
                              : item.quantidadeKg
                          ).toLocaleString('pt-BR')}
                        </Text>
                      </View>

                      {/* RESPONSÁVEL */}
                      <View className="border-t border-slate-100 pt-3">
                        <Text className="text-sm text-slate-500">
                          Responsável
                        </Text>

                        <Text className="mt-1 font-semibold text-slate-700">
                          {item.responsavel}
                        </Text>
                      </View>
                    </View>

                    {/* BOTÕES */}
                    <View className="mt-4 flex-row gap-3">
                      {emEdicao ? (
                        <>
                          <Pressable
                            onPress={salvarEdicao}
                            disabled={salvando}
                            className="flex-1 items-center rounded-xl py-3"
                            style={{
                              backgroundColor: salvando ? '#BFA8D8' : COR_PRINCIPAL,
                            }}
                          >
                            <Text className="font-bold text-white">
                              {salvando ? 'Salvando...' : 'Salvar'}
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={cancelarEdicao}
                            disabled={salvando}
                            className="flex-1 items-center rounded-xl bg-slate-100 py-3"
                          >
                            <Text className="font-bold text-slate-600">
                              Cancelar
                            </Text>
                          </Pressable>
                        </>
                      ) : (
                        <>
                          {manual && (
                            <Pressable
                              onPress={() => editarDoacao(item)}
                              className="flex-1 items-center rounded-xl bg-purple-50 py-3"
                            >
                              <Text
                                className="font-bold"
                                style={{ color: COR_PRINCIPAL }}
                              >
                                Editar
                              </Text>
                            </Pressable>
                          )}

                          <Pressable
                            onPress={() => excluirDoacao(item)}
                            className="flex-1 items-center rounded-xl bg-red-100 py-3 active:bg-red-200"
                          >
                            <Text className="font-bold text-red-600">
                              Excluir
                            </Text>
                          </Pressable>

                        </>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}